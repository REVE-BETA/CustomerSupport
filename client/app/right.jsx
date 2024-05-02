import axios from "axios";
import React, { useEffect, useState } from "react";

const UserListComponent = () => {
  const token = JSON.parse(localStorage.getItem("access_token"));
  const { payload2 } = token;

  const [activeTab, setActiveTab] = useState("Open");
  const [openChats, setOpenChats] = useState([]);
  const [resolvedChats, setResolvedChats] = useState([]);

  const getOpenChats = async () => {
    try {
      const response = await axios.get("http://localhost:8000/chat/getAll", {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      setOpenChats(response.data);
    } catch (error) {
      console.error("Error fetching open chats:", error);
    }
  };

  const getResolvedChats = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat/resolved_customer_for_agent",
        {
          chat_receiver: payload2.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      setResolvedChats(response.data);
    } catch (error) {
      console.error("Error fetching resolved chats:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "Open") {
      getOpenChats();
    } else if (activeTab === "Resolved") {
      getResolvedChats();
    }
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const accept_req = async (id) => {
    if(!payload2.id){
      return console.log('no id',payload2.id)
    }
    try {
      const response = await axios.patch(
        `http://localhost:8000/chat/in-session`,
        {
          chat_receiver: 3, //payload2.id,
          chatId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      ////////////////////////
      console.log(payload2.id, 'iddd')
      const data = await axios.patch(
        `http://localhost:8000/message/update_messages_agent`,
        {
          agentId: payload2.id,
          chatId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        }
      );
      console.log(data,'msgsssss')
    } catch (error) {
      return("Error changing it to in session:", error);
    }

  };
///////////////////////////
  return (
    <div className="flex flex-col">
      <div className="flex bg-gray-200 p-2 mb-4">
        <button
          className={`mr-2 px-4 py-2 rounded ${
            activeTab === "Open" ? "bg-blue-500 text-white" : "bg-gray-300"
          }`}
          onClick={() => handleTabChange("Open")}
        >
          Open
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "Resolved" ? "bg-blue-500 text-white" : "bg-gray-300"
          }`}
          onClick={() => handleTabChange("Resolved")}
        >
          Resolved
        </button>
      </div>

      <div className="flex flex-col">
        <div className="overflow-y-auto">
          {activeTab === "Open" &&
            openChats &&
            openChats.map((chat) => (
              <div key={chat.chatId} className="flex items-center justify-between border-b border-gray-200 py-2 px-4">
                <div className="flex flex-col">
                  <span className="text-lg">{chat.chatSender?.service_name}</span>
                  <p className="text-gray-600 text-sm mt-1">
                    <span>{chat.chatSender?.name}:</span>
                    {chat?.chatTitle.length > 20
                      ? `${chat?.chatTitle.substring(0, 20)}...`
                      : chat?.chatTitle}
                  </p>
                </div>
                <button
                  className="ml-2 px-4 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-700"
                  onClick={() => accept_req(chat.chatId)}
                >
                  Open
                </button>
              </div>
            ))}
          {activeTab === "Resolved" &&
            resolvedChats &&
            resolvedChats.map((chat) => (
              <div key={chat.chatId} className="flex items-center justify-between border-b border-gray-200 py-2 px-4">
                <div className="flex flex-col">
                  <span className="text-lg">{chat.chatSender?.service_name}</span>
                  <p className="text-gray-600 text-sm mt-1">
                    <span>{chat.chatSender?.name}:</span>{" "}
                    {chat?.chatTitle.length > 20
                      ? `${chat?.chatTitle.substring(0, 20)}...`
                      : chat?.chatTitle}
                  </p>
                </div>
              
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UserListComponent;
