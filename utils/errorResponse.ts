export class ErrorResponse extends Error {
  statusCode: number;
  constructor(message: any, statusCode: number) {
    super(message); // transfer to parent Error
    this.statusCode = statusCode;
  }
}
