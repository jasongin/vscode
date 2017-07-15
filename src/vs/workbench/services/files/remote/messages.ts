import { Message, Field, MapField } from 'protobufjs/light';

export class MessageValue extends Message<MessageValue> {
	@Field.d(1, 'string')
	public stringValue: string;

	@Field.d(2, 'int32')
	public int32Value: number;

	@Field.d(3, 'bool')
	public boolValue: boolean;

	@Field.d(4, 'array')
	public arrayValue: MessageValue[];

	@MapField.d(5, 'string', MessageValue)
	public dictionaryValue: {[key: string]: MessageValue};

	@Field.d(6, 'bytes')
	public bufferValue: Buffer;
}

export class RequestMessage extends Message<RequestMessage> {
	@Field.d(1, 'string')
	public method: string;

	@Field.d(2, MessageValue, 'repeated')
	public args: MessageValue[];
}

export class ResponseMessage extends Message<ResponseMessage> {
	@Field.d(1, 'int64')
	public requestId: number;

	@Field.d(2, MessageValue)
	public result: MessageValue;
}

export class EventMessage extends Message<EventMessage> {
	@Field.d(1, 'string')
	public event: string;

	@Field.d(2, MessageValue, 'repeated')
	public args: MessageValue[];
}

export class ErrorMessage extends Message<ErrorMessage> {
	@Field.d(1, 'int64')
	public failedMessageId: number;

	@Field.d(2, 'int32')
	public code: number;

	@Field.d(3, 'string')
	public description: string;

	@Field.d(4, MessageValue)
	public details: MessageValue;
}

export class MessageEnvelope extends Message<MessageEnvelope> {
	@Field.d(1, 'int64')
	public id: number;

	@Field.d(2, 'string')
	public service: string;

	@Field.d(3, RequestMessage)
	public request: RequestMessage;

	@Field.d(3, ResponseMessage)
	public response: ResponseMessage;

	@Field.d(3, EventMessage)
	public event: EventMessage;

	@Field.d(3, ErrorMessage)
	public error: ErrorMessage;
}
