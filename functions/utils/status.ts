import { StatusCodes } from "http-status-codes";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
};

const status = (statusCode: number) => ({
  statusCode,
  headers: process.env.NODE_ENV === "development" ? headers : undefined,
});

export const statusCodes = {
  OK: status(StatusCodes.OK),
  BAD_REQUEST: status(StatusCodes.BAD_REQUEST),
  INTERNAL_SERVER_ERROR: status(StatusCodes.INTERNAL_SERVER_ERROR),
};
