import { useAuth } from '../../Context/AuthProviderContext'

const Home = () => {
  const {logout} = useAuth();
  return (
    <div>
      <h1>Home</h1>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Home;
