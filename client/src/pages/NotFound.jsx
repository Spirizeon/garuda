/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-black text-white">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl mt-4">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button className="mt-6 px-6 p-5" variant='secondary'>
        Go Back Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;