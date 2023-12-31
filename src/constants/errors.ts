export enum ProviderRpcErrorCode {
  InvalidInput = -32000,
  ResourceNotFound = -32001,
  ResourceUnavailable = -32002,
  TransactionRejected = -32003,
  MethodNotSupported = -32004,
  LimitExceeded = -32005,
  Parse = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  Internal = -32603,
  UserRejectedRequest = 4001,
  Unauthorized = 4100,
  UnsupportedMethod = 4200,
  Disconnected = 4900,
  ChainDisconnected = 4901,
  UnrecognizedChain = 4902
}

export enum WalletConnectErrorSignature {
  FailedOrRejectedRequest = 'Failed or Rejected Request',
  RejectedByTheUser = 'Reject by the user',
  RejectedByUser = 'Rejected by User',
  SignatureDenied = 'signature denied', // Ambire
  RejectedByUser2 = 'Rejected by user', // Argent
  AmbireUserRejectedRequest = 'Ambire user rejected the request',
  RequestRejected = 'Request rejected'
}
