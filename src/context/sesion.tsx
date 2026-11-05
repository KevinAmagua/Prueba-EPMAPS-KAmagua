import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { auth } from '@/config/firebase-auth';
import { normalizarCorreo } from '@/lib/validaciones';

type SesionContextValue = {
  usuario: User | null;
  cargando: boolean;
  errorSesion: unknown | null;
  revisionPerfil: number;
  iniciarSesion: (correo: string, clave: string) => Promise<void>;
  registrarse: (nombre: string, correo: string, clave: string) => Promise<void>;
  actualizarNombre: (nombre: string) => Promise<void>;
  reenviarVerificacion: () => Promise<void>;
  actualizarVerificacion: () => Promise<boolean>;
  enviarCorreoRecuperacion: (correo: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const SesionContext = createContext<SesionContextValue | null>(null);

export function SesionProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorSesion, setErrorSesion] = useState<unknown | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (nuevoUsuario) => {
        setUsuario(nuevoUsuario);
        setErrorSesion(null);
        setCargando(false);
      },
      (error) => {
        setUsuario(null);
        setErrorSesion(error);
        setCargando(false);
      },
    );
  }, []);

  const iniciarSesion = useCallback(async (correo: string, clave: string) => {
    const { user } = await signInWithEmailAndPassword(auth, normalizarCorreo(correo), clave);
    await reload(user);

    if (!user.emailVerified) {
      throw Object.assign(new Error('El correo todavía no está verificado.'), {
        code: 'auth/email-not-verified',
      });
    }
  }, []);

  const registrarse = useCallback(async (nombre: string, correo: string, clave: string) => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      normalizarCorreo(correo),
      clave,
    );
    await updateProfile(user, { displayName: nombre.trim() });
    await sendEmailVerification(user);
  }, []);

  const actualizarNombre = useCallback(async (nombre: string) => {
    const user = auth.currentUser;
    const nombreLimpio = nombre.trim();
    if (!user) {
      throw Object.assign(new Error('No hay una sesión activa.'), {
        code: 'auth/no-current-user',
      });
    }
    if (!nombreLimpio) {
      throw Object.assign(new Error('El nombre no puede estar vacío.'), {
        code: 'profile/invalid-name',
      });
    }

    await updateProfile(user, { displayName: nombreLimpio });
    setUsuario(user);
    setRevision((value) => value + 1);
  }, []);

  const reenviarVerificacion = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      throw Object.assign(new Error('No hay una sesión activa.'), {
        code: 'auth/no-current-user',
      });
    }

    await reload(user);
    if (user.emailVerified) {
      setRevision((value) => value + 1);
      return;
    }

    await sendEmailVerification(user);
  }, []);

  const actualizarVerificacion = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    await reload(user);
    setUsuario(user);
    setRevision((value) => value + 1);
    return user.emailVerified;
  }, []);

  const enviarCorreoRecuperacion = useCallback(async (correo: string) => {
    await sendPasswordResetEmail(auth, normalizarCorreo(correo));
  }, []);

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      errorSesion,
      revisionPerfil: revision,
      iniciarSesion,
      registrarse,
      actualizarNombre,
      reenviarVerificacion,
      actualizarVerificacion,
      enviarCorreoRecuperacion,
      cerrarSesion,
    }),
    [
      actualizarNombre,
      actualizarVerificacion,
      cargando,
      cerrarSesion,
      errorSesion,
      enviarCorreoRecuperacion,
      iniciarSesion,
      reenviarVerificacion,
      registrarse,
      usuario,
      revision,
    ],
  );

  return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
}

export function useSesion(): SesionContextValue {
  const context = useContext(SesionContext);
  if (!context) {
    throw new Error('useSesion debe utilizarse dentro de SesionProvider.');
  }
  return context;
}
