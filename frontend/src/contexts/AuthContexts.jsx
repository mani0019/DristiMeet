import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8080/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);

  const handleRegister = async (username, name, password) => {
    try {
      const request = await client.post("/register", {
        username,
        name,
        password,
      });

      if (request.status === 201) {
        return request.data.message;
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === 200) {
        localStorage.setItem("token", request.data.token);
        setUserData(request.data.user);
        navigate("/home");
      }
    } catch (error) {
      throw error.response?.data || error;
    }
  };
  const getHistoryOfUser= async()=>{
    try{
      let request =await client.get("/get_all_activity",{
        params :{
          token :localStorage.getItem("token")
        }
      });
      return request.data;
    }catch(e){
      throw e;
    }
  }

  const addToUserHistory = async (meetingCode) => {
  const token = localStorage.getItem("token");

  if (!token || !meetingCode) return;

  try {
    const res = await client.post("/add_to_activity", {
      token,
      meetingCode,
    });
    return res.data;
  } catch (e) {
    console.error("Add history failed:", e.response?.data || e);
    throw e;
  }
};


 const value = {
  userData,
  setUserData,
  handleRegister,
  handleLogin,
  addToUserHistory,     // ✅ ADD THIS
  getHistoryOfUser,     // ✅ ADD THIS (you’ll need it later)
};


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
