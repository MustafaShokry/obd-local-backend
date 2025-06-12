import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { User } from '../entities/user.entity';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  userImage?: Buffer;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsObject()
  @IsNotEmpty()
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  licenseExpiry: string;

  @IsObject()
  @IsNotEmpty()
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  @IsString()
  @IsNotEmpty()
  subscriptionPlan: string;

  @IsString()
  @IsNotEmpty()
  subscriptionExpiry: string;
}
