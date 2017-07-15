/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import os = require('os');
import crypto = require('crypto');
import paths = require('path');
import assert = require('assert');

import { isParent, FileOperation, FileOperationEvent, IContent, IFileService, IResolveFileOptions, IResolveFileResult, IResolveContentOptions, IFileStat, IStreamContent, FileOperationError, FileOperationResult, IUpdateContentOptions, FileChangeType, IImportResult, MAX_FILE_SIZE, FileChangesEvent, IFilesConfiguration } from 'vs/platform/files/common/files';
import { isEqualOrParent } from 'vs/base/common/paths';
import { ResourceMap } from 'vs/base/common/map';
import arrays = require('vs/base/common/arrays');
import baseMime = require('vs/base/common/mime');
import { TPromise } from 'vs/base/common/winjs.base';
import types = require('vs/base/common/types');
import objects = require('vs/base/common/objects');
import { nfcall, Limiter, ThrottledDelayer } from 'vs/base/common/async';
import uri from 'vs/base/common/uri';
import { dispose, IDisposable, toDisposable } from 'vs/base/common/lifecycle';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';

import encoding = require('vs/base/node/encoding');
import Event, { Emitter } from 'vs/base/common/event';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { IEncodingOverride } from 'vs/workbench/services/files/node/fileService';

export interface IFileServiceOptions {
	remoteEndpoint: string;
	tmpDir?: string;
	errorLogger?: (msg: string) => void;
	encodingOverride?: IEncodingOverride[];
	watcherIgnoredPatterns?: string[];
	disableWatcher?: boolean;
	verboseLogging?: boolean;
	useExperimentalFileWatcher?: boolean;
}

export class FileService implements IFileService {

	public _serviceBrand: any;

	private tmpPath: string;
	private options: IFileServiceOptions;

	private _onFileChanges: Emitter<FileChangesEvent>;
	private _onAfterOperation: Emitter<FileOperationEvent>;

	private toDispose: IDisposable[];

	private currentWorkspaceRootsCount: number;

	constructor(
		private contextService: IWorkspaceContextService,
		private configurationService: IConfigurationService,
		options: IFileServiceOptions,
	) {
		this.toDispose = [];
		this.options = options || Object.create(null);
		this.tmpPath = this.options.tmpDir || os.tmpdir();

		this._onFileChanges = new Emitter<FileChangesEvent>();
		this.toDispose.push(this._onFileChanges);

		this._onAfterOperation = new Emitter<FileOperationEvent>();
		this.toDispose.push(this._onAfterOperation);

		if (!this.options.errorLogger) {
			this.options.errorLogger = console.error;
		}

		this.registerListeners();
	}

	private registerListeners(): void {
		this.toDispose.push(this.contextService.onDidChangeWorkspaceRoots(() => this.onDidChangeWorkspaceRoots()));
	}

	private onDidChangeWorkspaceRoots(): void {
		const newRootCount = this.contextService.hasWorkspace() ? this.contextService.getWorkspace().roots.length : 0;

		let restartWorkspaceWatcher = false;
		if (this.currentWorkspaceRootsCount <= 1 && newRootCount > 1) {
			restartWorkspaceWatcher = true; // transition: from 1 or 0 folders to 2+
		} else if (this.currentWorkspaceRootsCount > 1 && newRootCount <= 1) {
			restartWorkspaceWatcher = true; // transition: from 2+ folders to 1 or 0
		}

		if (restartWorkspaceWatcher) {
			this.setupWorkspaceWatching();
		}

		this.currentWorkspaceRootsCount = newRootCount;
	}

	public get onFileChanges(): Event<FileChangesEvent> {
		return this._onFileChanges.event;
	}

	public get onAfterOperation(): Event<FileOperationEvent> {
		return this._onAfterOperation.event;
	}

	public updateOptions(options: IFileServiceOptions): void {
		if (options) {
			objects.mixin(this.options, options); // overwrite current options
		}
	}

	private setupWorkspaceWatching(): void {
		// TODO: setupWorkspaceWatching
	}

	public resolveFile(resource: uri, options?: IResolveFileOptions): TPromise<IFileStat> {
		// TODO: resolveFile
		return undefined;
	}

	public resolveFiles(toResolve: { resource: uri, options?: IResolveFileOptions }[]): TPromise<IResolveFileResult[]> {
		// TODO: resolveFiles
		return undefined;
	}

	public existsFile(resource: uri): TPromise<boolean> {
		return this.resolveFile(resource).then(() => true, () => false);
	}

	public resolveContent(resource: uri, options?: IResolveContentOptions): TPromise<IContent> {
		// TODO: resolveContent
		return undefined;
	}

	public resolveStreamContent(resource: uri, options?: IResolveContentOptions): TPromise<IStreamContent> {
		// TODO: resolveStreamContent
		return undefined;
	}

	public resolveContents(resources: uri[]): TPromise<IContent[]> {
		// TODO: resolveContents
		return undefined;
	}

	public updateContent(resource: uri, value: string, options: IUpdateContentOptions = Object.create(null)): TPromise<IFileStat> {
		// TODO: updateContent
		return undefined;
	}

	public createFile(resource: uri, content: string = ''): TPromise<IFileStat> {

		// Create file
		return this.updateContent(resource, content).then(result => {

			// Events
			this._onAfterOperation.fire(new FileOperationEvent(resource, FileOperation.CREATE, result));

			return result;
		});
	}

	public createFolder(resource: uri): TPromise<IFileStat> {
		// TODO: createFolder
		return undefined;
	}

	public touchFile(resource: uri): TPromise<IFileStat> {
		// TODO: touchFile
		return undefined;
	}

	public rename(resource: uri, newName: string): TPromise<IFileStat> {
		const newPath = paths.join(paths.dirname(resource.fsPath), newName);

		return this.moveFile(resource, uri.file(newPath));
	}

	public moveFile(source: uri, target: uri, overwrite?: boolean): TPromise<IFileStat> {
		// TODO: moveFile
		return undefined;
	}

	public copyFile(source: uri, target: uri, overwrite?: boolean): TPromise<IFileStat> {
		// TODO: copyFile
		return undefined;
	}

	public importFile(source: uri, targetFolder: uri): TPromise<IImportResult> {
		// TODO: importFile
		return undefined;
	}

	public del(resource: uri): TPromise<void> {
		// TODO: del
		return undefined;
	}

	public getEncoding(resource: uri, preferredEncoding?: string): string {
		// TODO: getEncoding
		return undefined;
	}

	public watchFileChanges(resource: uri): void {
		assert.ok(resource && resource.scheme === 'file', `Invalid resource for watching: ${resource}`);

		// TODO: watchFileChanges
	}
	public unwatchFileChanges(resource: uri): void;
	public unwatchFileChanges(path: string): void;
	public unwatchFileChanges(arg1: any): void {
		// TODO: unwatchFileChanges
	}

	public dispose(): void {
		this.toDispose = dispose(this.toDispose);
	}
}
