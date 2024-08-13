export type SupportedPasswordManager = 'pass'

export interface PasswordManager {
  readPassword (): Promise<string>;
}
