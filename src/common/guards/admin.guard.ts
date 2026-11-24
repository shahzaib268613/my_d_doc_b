import { CanActivate, Injectable } from '@nestjs/common'

/** Placeholder until real admin auth exists. Currently allows all requests. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(): boolean {
    return true
  }
}
