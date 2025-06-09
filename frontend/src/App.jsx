import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './Home/Home.jsx';
import Header from './Layout/Header.jsx';
import Signup from './Authentication/Signup.jsx';
import Login from './Authentication/Login.jsx';
import Profile from './Profile/Profile.jsx';
import Post from './Post/Post.jsx';
import Chat from './Chat/Chat.jsx';
import UserProfile from './Profile/UserProfile.jsx';
import FrontPage from './Home/FrontPage.jsx';
import OtherUsers from './Users/OtherUsers.jsx';
import PageContent from './Home/PageContent.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontPage />}>
                         <Route path="/home" element={<Home />} />
         <Route path="/profile" element={<Profile />} />
        <Route path="/post" element={<Post />} />
        <Route path="/chat" element={<Chat />} />
          <Route path="/users" element={<OtherUsers />} />
         <Route path="/" element={<PageContent />} />

        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
