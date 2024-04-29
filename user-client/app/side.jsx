'use client'
import axios from "axios";
import React, { useState, useEffect } from "react";

const ActiveSessions = () => {
  const [resolvedSessions, setResolvedSessions] = useState([]);

  useEffect(() => {
    const fetchResolvedSessions = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("access_token"));

        const response = await axios.post("http://localhost:8000/chat/resolved_for_customer",{
          chat_sender : token.payload2.id
        }); // Replace with your API endpoint
        const data = await response.json();
        console.log(data, "side")
        setResolvedSessions(data);
      } catch (error) {
        console.error("Error fetching resolved sessions:", error);
      }
    };

    fetchResolvedSessions();
  }, []); // Empty dependency array to fetch data only once on component mount

  return (
    <div className="bg-white rounded-lg shadow-md px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <button className="px-4 py-2 text-lg font-medium text-gray-700 hover:text-blue-500">
          Resolved ({resolvedSessions && resolvedSessions.length})
        </button>
      </div>
      <div className="flex flex-col space-y-2">
        {resolvedSessions && resolvedSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex flex-col">
              <p className="text-lg font-medium text-gray-700">
                {session.Title}
              </p>{" "}
              {/* Assuming session object has a `name` property */}
              <p className="text-sm text-gray-500">ID: {session.id}</p>{" "}
              {/* Assuming session object has an `id` property */}
            </div>
            <svg
              className="h-6 w-6 fill-green"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 6L14 10l-4 4V14zM2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S15.523 2 10 2z" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveSessions;
