import { Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodBody, ZodQuery } from '../../common/decorators/zod.decorator';
import { LocalRealtimeAdapter } from '../realtime/local-realtime.adapter';
import { conversationChannel, userChannel } from '../realtime/realtime.port';
import { ChatService } from './chat.service';
import {
  createConversationSchema,
  messageQuerySchema,
  sendMessageSchema,
  typingSchema,
} from './dto/chat.schema';

@ApiTags('chat')
@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly local: LocalRealtimeAdapter,
  ) {}

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Thread list (last message + unread count)' })
  list(@CurrentUser('id') userId: string) {
    return this.chat.list(userId);
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Get-or-create a 1:1 conversation' })
  create(
    @CurrentUser('id') userId: string,
    @ZodBody(createConversationSchema) body: typeof createConversationSchema._type,
  ) {
    return this.chat.getOrCreate(userId, body);
  }

  @ApiBearerAuth()
  @Get('realtime-token')
  @ApiOperation({ summary: 'Credentials for the RealtimePort' })
  realtimeToken(@CurrentUser('id') userId: string) {
    return this.chat.realtimeToken(userId);
  }

  @ApiBearerAuth()
  @Get(':id/messages')
  @ApiOperation({ summary: 'Paginated message history (cursor)' })
  messages(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @ZodQuery(messageQuerySchema) query: typeof messageQuerySchema._type,
  ) {
    return this.chat.messages(userId, id, query);
  }

  @ApiBearerAuth()
  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message' })
  send(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @ZodBody(sendMessageSchema) body: typeof sendMessageSchema._type,
  ) {
    return this.chat.send(userId, id, body);
  }

  @ApiBearerAuth()
  @Post(':id/read')
  @ApiOperation({ summary: 'Mark conversation read' })
  read(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.chat.markRead(userId, id);
  }

  @ApiBearerAuth()
  @Post(':id/typing')
  @ApiOperation({ summary: 'Broadcast typing indicator' })
  typing(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @ZodBody(typingSchema) body: typeof typingSchema._type,
  ) {
    return this.chat.typing(userId, id, body.isTyping);
  }

  /**
   * [local adapter] Server-Sent Events stream. Token-authed via the realtime
   * token (EventSource can't set Authorization headers). In cloud mode the
   * client subscribes to Supabase Realtime directly instead.
   */
  @Public()
  @Get('stream')
  @ApiOperation({ summary: '[local] SSE event stream' })
  async stream(
    @Query('token') token: string,
    @Query('conversationId') conversationId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const claims = await this.local.verifyClientToken(token).catch(() => null);
    if (!claims) {
      res.status(401).json({ statusCode: 401, code: 'INVALID_TOKEN', message: 'Invalid token' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const channels = [userChannel(claims.sub)];
    if (conversationId) channels.push(conversationChannel(conversationId));

    const unsubscribe = this.local.subscribe(channels, (msg) => {
      res.write(`event: ${msg.event}\ndata: ${JSON.stringify(msg.payload)}\n\n`);
    });
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
      res.end();
    });
  }
}
