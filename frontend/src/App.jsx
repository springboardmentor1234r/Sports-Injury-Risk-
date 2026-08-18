import { HashRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/routes.jsx';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);


  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
