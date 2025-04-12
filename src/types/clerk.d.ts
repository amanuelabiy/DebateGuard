declare module '@clerk/nextjs' {
  import { ReactNode } from 'react';
  
  export interface ClerkProviderProps {
    children: ReactNode;
    publishableKey?: string;
    [key: string]: any;
  }
  
  export function ClerkProvider(props: ClerkProviderProps): JSX.Element;
  export function useAuth(): any;
  export function useUser(): any;
  export function useClerk(): any;
  export function SignIn(): JSX.Element;
  export function SignUp(): JSX.Element;
  export function UserButton(): JSX.Element;
  export function SignedIn(props: { children: ReactNode }): JSX.Element;
  export function SignedOut(props: { children: ReactNode }): JSX.Element;
} 