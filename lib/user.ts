export class User {
  Token: string;
  Name: string;
  Email: string;
  constructor(token: string, name: string, email: string) {
    this.Token = token;
    this.Name = name;
    this.Email = email;
  }
}