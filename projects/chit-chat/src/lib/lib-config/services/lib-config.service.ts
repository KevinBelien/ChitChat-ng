import { InjectionToken } from '@angular/core';
import { LibConfig } from '../models';

export const LibConfigService = new InjectionToken<LibConfig>(
	'LibConfig'
);
