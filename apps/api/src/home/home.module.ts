import { Module } from '@nestjs/common';
import { HomeController } from './home.controller.js';
import { HomeRepository } from './home.repository/index.js';
import { HomeService } from './home.service/index.js';

@Module({ controllers: [HomeController], providers: [HomeRepository, HomeService] })
export class HomeModule {}
