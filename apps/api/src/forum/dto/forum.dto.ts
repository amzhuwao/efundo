import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscussionDto {
  @ApiProperty() @IsString() subjectId: string;
  @ApiProperty() @IsString() @MinLength(5) title: string;
  @ApiProperty() @IsString() @MinLength(10) body: string;
}

export class CreateCommentDto {
  @ApiProperty() @IsString() @MinLength(1) body: string;
}

export class AcceptCommentDto {
  @ApiProperty() accepted: boolean;
}
