import '../styles/Sidebar.css';

import { useNavigate } from 'react-router-dom';

const Sidebar = ({ user, setFarm, setChat, setReport, setDroneSim }: {
  user: { name: string; phone: string },
  setFarm: () => void,
  setChat: () => void,
  setReport: () => void,
  setDroneSim: () => void
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <h3>Welcome</h3>
      <p>{user.name}</p>
      <p>{user.phone}</p>
      <nav>
        <ul>
          <li onClick={() => setFarm()}>Farm Management</li>
          <li onClick={() => setReport()}>Reports</li>
          <li onClick={() => setChat()}>Chat History</li>
          <li onClick={() => setDroneSim()}>Drone Simulation</li>
        </ul>
      </nav>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </aside>
  );
};

export default Sidebar;
