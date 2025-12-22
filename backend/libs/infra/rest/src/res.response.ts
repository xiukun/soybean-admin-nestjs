import { ApiProperty } from '@nestjs/swagger';

import {
  RESPONSE_SUCCESS_CODE,
  RESPONSE_SUCCESS_MSG,
} from '@lib/constants/rest.constant';

export class ApiRes<T> {
  @ApiProperty({ description: 'data' })
  data?: T;

  @ApiProperty({
    type: 'number',
    default: RESPONSE_SUCCESS_CODE,
    description: 'status',
  })
  status: number;

  @ApiProperty({
    type: 'string',
    default: RESPONSE_SUCCESS_MSG,
    description: 'msg',
  })
  msg: string;

  private constructor(
    status: number,
    data: any,
    msg: string = RESPONSE_SUCCESS_MSG,
  ) {
    this.status = status;
    this.data = data;
    this.msg = msg;
  }

  static success<T>(
    data: T,
    msg: string = RESPONSE_SUCCESS_MSG,
  ): ApiRes<T> {
    return new ApiRes(RESPONSE_SUCCESS_CODE, data, msg);
  }

  static ok(): ApiRes<null> {
    return new ApiRes(RESPONSE_SUCCESS_CODE, null, RESPONSE_SUCCESS_MSG);
  }

  static error<T = null>(status: number, msg: string): ApiRes<T> {
    return new ApiRes(status, null, msg);
  }

  static custom<T>(status: number, data: T, msg: string): ApiRes<T> {
    return new ApiRes(status, data, msg);
  }
}
