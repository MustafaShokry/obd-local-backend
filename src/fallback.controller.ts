import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller()
export class FallbackController {
  private readonly publicPath = join(__dirname, '..', 'public');

  @Get('*')
  serveStaticOrSpa(@Param() params: any, @Res() res: Response): void {
    const requestPath = params[0] || '';
    console.log(requestPath);
    // Skip API routes
    if (requestPath.startsWith('api/')) {
      res.status(HttpStatus.NOT_FOUND).send('API route not found');
      return;
    }

    // Try to serve static file first
    const filePath = join(this.publicPath, requestPath);
    if (existsSync(filePath) && !requestPath.endsWith('/')) {
      res.sendFile(filePath);
      return;
    }

    // For routes or when file doesn't exist, serve index.html
    const indexPath = join(this.publicPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(HttpStatus.NOT_FOUND).send('Application not found');
    }
  }
}
