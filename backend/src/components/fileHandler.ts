import fs from 'fs';
import path from 'path';
import {promisify} from 'util';

import "dotenv/config"

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const isProd = process.env.NODE_ENV === "production"


/**
 * @interface FileHandlerOptions
 * @param {string} uploadDir Upload dir relative to main dir
 * @param {boolean} visibilityPublic weather the file should be public
 */
export interface FileHandlerOptions {
    uploadDir?: string;
    visibilityPublic: boolean;
}

export class FileHandler {
    private readonly uploadDir: string;

    private BASE_UPLOADS_DIR = path.join(__dirname, '../../uploads');

    private readonly relativePath: string | undefined;

    private readonly BASE_URL = "https://f19c5f75fffa.ngrok-free.app"
    constructor(options: FileHandlerOptions) {

        this.uploadDir = this.BASE_UPLOADS_DIR
        if (options?.visibilityPublic) {
            this.uploadDir = path.join(this.BASE_UPLOADS_DIR, 'public')
        } else {
            this.uploadDir = path.join(this.BASE_UPLOADS_DIR, 'private')
        }

        if (options.uploadDir) {
            this.uploadDir = path.join(this.uploadDir, options.uploadDir);
            this.relativePath = options.uploadDir
        }
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, {recursive: true});
        }
    }

    async saveFile(filename: string, buffer: Buffer): Promise<string> {
        const filePath = path.join(this.uploadDir, filename);
        await writeFileAsync(filePath, buffer);
        return filePath;
    }

    async deleteFile(filename: string): Promise<void> {
        const filePath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
        }
    }

    getFileUrl(filename: string): string {
        return `${this.BASE_URL}/files/${this.relativePath ? this.relativePath + '/' : ''}${filename}`;
    }
}

