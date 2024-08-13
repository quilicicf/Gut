export type PasswordManagerCreator = (toolName: string, accountName: string) => PasswordManager;

export interface PasswordManager {
  readPassword (): Promise<string>;
}
