import { Context, Schema } from 'koishi';
export interface Config {
    debug?: boolean;
    updateInterval?: number;
    enableAutoUpdate?: boolean;
    enableOfficialNews?: boolean;
    enableFeedbackNews?: boolean;
    broadcastTarget?: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
