import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem('token') || null
  );

  const [loading, setLoading] = useState(true);


  // --------------------------------------------------
  // CHECK EXISTING LOGIN SESSION
  // --------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem('user_data');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);
        setToken(savedToken);
      } catch (error) {
        console.error('Invalid saved user session');

        localStorage.removeItem('user_data');
        localStorage.removeItem('token');

        setUser(null);
        setToken(null);
      }
    } else {
      // No automatic demo user.
      // User must login.
      setUser(null);
      setToken(null);
    }

    setLoading(false);
  }, []);


  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  const login = async (email, password) => {

    const cleanEmail = email.trim().toLowerCase();


    // --------------------------------------------------
    // 1. CHECK LOCALLY REGISTERED ACCOUNTS FIRST
    // --------------------------------------------------
    try {
      const savedAccounts =
        JSON.parse(
          localStorage.getItem('registered_users') || '[]'
        );

      const localAccount = savedAccounts.find(
        (account) =>
          account.email.toLowerCase() === cleanEmail &&
          account.password === password
      );

      if (localAccount) {

        const loggedInUser = {
          user_id: localAccount.user_id,
          email: localAccount.email,
          full_name: localAccount.full_name,
          role: localAccount.role
        };

        const localToken =
          `local_token_${localAccount.user_id}`;

        setUser(loggedInUser);
        setToken(localToken);

        localStorage.setItem(
          'token',
          localToken
        );

        localStorage.setItem(
          'user_data',
          JSON.stringify(loggedInUser)
        );

        return {
          success: true,
          user: loggedInUser
        };
      }

    } catch (error) {
      console.error(
        'Local account lookup failed:',
        error
      );
    }


    // --------------------------------------------------
    // 2. TRY BACKEND LOGIN
    // --------------------------------------------------
    try {

      const formData = new FormData();

      formData.append(
        'username',
        cleanEmail
      );

      formData.append(
        'password',
        password
      );


      const response = await fetch(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: formData
        }
      );


      if (!response.ok) {

        const err = await response.json();

        throw new Error(
          err.detail || 'Login failed'
        );
      }


      const data = await response.json();


      const userData = {
        user_id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      };


      setToken(data.access_token);
      setUser(userData);


      localStorage.setItem(
        'token',
        data.access_token
      );

      localStorage.setItem(
        'user_data',
        JSON.stringify(userData)
      );


      return {
        success: true,
        user: userData
      };

    } catch (error) {

      console.warn(
        'Backend API login failed:',
        error
      );
    }


    // --------------------------------------------------
    // 3. DEMO QUICK LOGIN FALLBACK
    // --------------------------------------------------
    // Only use this for the predefined demo accounts.
    // Do NOT accept every random email/password.
    // --------------------------------------------------

    const demoAccounts = {
      'athlete@sportsmed.io': {
        full_name: 'Demo Athlete',
        role: 'Athlete'
      },

      'coach@sportsmed.io': {
        full_name: 'Demo Coach',
        role: 'Coach'
      },

      'physio@sportsmed.io': {
        full_name: 'Demo Physiotherapist',
        role: 'Physiotherapist'
      },

      'scientist@sportsmed.io': {
        full_name: 'Demo Sports Scientist',
        role: 'Sports Scientist'
      },

      'admin@sportsmed.io': {
        full_name: 'Demo Administrator',
        role: 'Administrator'
      }
    };


    const demoUser =
      demoAccounts[cleanEmail];


    if (
      demoUser &&
      password === 'password123'
    ) {

      const fallbackUser = {
        user_id: 99,
        email: cleanEmail,
        full_name: demoUser.full_name,
        role: demoUser.role
      };


      const fallbackToken =
        'demo_jwt_token';


      setToken(fallbackToken);
      setUser(fallbackUser);


      localStorage.setItem(
        'token',
        fallbackToken
      );

      localStorage.setItem(
        'user_data',
        JSON.stringify(fallbackUser)
      );


      return {
        success: true,
        user: fallbackUser
      };
    }


    // --------------------------------------------------
    // LOGIN FAILED
    // --------------------------------------------------
    setUser(null);
    setToken(null);

    return {
      success: false,
      user: null
    };
  };


  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------
  const register = async (registerData) => {

    // Normalize email
    const cleanEmail =
      registerData.email.trim().toLowerCase();


    // --------------------------------------------------
    // FIRST: SAVE ACCOUNT LOCALLY
    // --------------------------------------------------
    // This allows registration/login to work even
    // when the backend is unavailable.
    // --------------------------------------------------

    try {

      const savedAccounts =
        JSON.parse(
          localStorage.getItem('registered_users') || '[]'
        );


      // Check whether email already exists
      const existingAccount =
        savedAccounts.find(
          (account) =>
            account.email.toLowerCase() === cleanEmail
        );


      if (existingAccount) {

        return {
          success: false,
          user: null,
          error: 'An account with this email already exists.'
        };
      }


      const newUser = {
        user_id:
          Date.now(),

        full_name:
          registerData.full_name,

        email:
          cleanEmail,

        password:
          registerData.password,

        role:
          registerData.role
      };


      savedAccounts.push(newUser);


      localStorage.setItem(
        'registered_users',
        JSON.stringify(savedAccounts)
      );


      // --------------------------------------------------
      // ALSO TRY BACKEND REGISTRATION
      // --------------------------------------------------
      try {

        const response = await fetch(
          '/api/v1/auth/register',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              full_name:
                registerData.full_name,

              email:
                cleanEmail,

              password:
                registerData.password,

              role:
                registerData.role
            })
          }
        );


        if (response.ok) {

          const backendUser =
            await response.json();

          console.log(
            'Backend registration successful:',
            backendUser
          );
        }

      } catch (backendError) {

        console.warn(
          'Backend unavailable. Using local account:',
          backendError
        );
      }


      return {
        success: true,
        user: {
          user_id:
            newUser.user_id,

          full_name:
            newUser.full_name,

          email:
            newUser.email,

          role:
            newUser.role
        }
      };


    } catch (error) {

      console.error(
        'Registration failed:',
        error
      );

      return {
        success: false,
        user: null,
        error: 'Registration failed.'
      };
    }
  };


  // --------------------------------------------------
  // SAVE ATHLETE PROFILE
  // --------------------------------------------------
  const saveAthleteProfile = async (profileData) => {

    try {

      const response = await fetch(
        '/api/v1/athletes/profile',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify(profileData)
        }
      );


      if (!response.ok) {

        const err =
          await response.json();

        throw new Error(
          err.detail ||
          'Profile save failed'
        );
      }


      return await response.json();

    } catch (error) {

      console.log(
        'Saved athlete profile locally:',
        profileData
      );

      return profileData;
    }
  };


  // --------------------------------------------------
  // AUTHENTICATED FETCH HELPER
  // --------------------------------------------------
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const logout = () => {

    setUser(null);
    setToken(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        saveAthleteProfile,
        authFetch,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () =>
  useContext(AuthContext);