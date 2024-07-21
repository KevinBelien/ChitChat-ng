import { InjectionToken } from '@angular/core';
import { LibConfig } from '../interfaces';

export const LibConfigService = new InjectionToken<LibConfig>(
	'LibConfig'
);
