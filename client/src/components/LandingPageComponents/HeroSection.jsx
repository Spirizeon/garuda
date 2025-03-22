import React from "react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { CheckCheckIcon } from "lucide-react";
import Hero from "../../assets/Hero.svg";
import { TypewriterEffectSmooth } from "../ui/typewriter-effect";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import { PinContainer } from "../ui/3d-pin";
import Resumes from "../../assets/resumes.webp";

// Sample resume image URL
const sampleResumeImage =
  "https://via.placeholder.com/300x400.png?text=Sample+Resume";

const words = [
  {
    text: "Resume",
    className: "text-blue-500 dark:text-blue-500",
  },
  {
    text: "Tailoring",
  },
];

const HeroSection = () => {
  return (
    <div className="w-full h-screen flex flex-col lg:flex-row justify-center items-center px-4 lg:px-8">
      <div className="w-full lg:w-1/2 h-auto lg:h-full flex flex-col justify-center items-center lg:items-start gap-4">
        <main className="text-2xl sm:text-3xl md:text-4xl font-bold text-center lg:text-left">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-[#F596D3] to-[#D247BF] text-transparent bg-clip-text">
              Elevate{" "}
            </span>
            Your Career with <br />
          </h1>
          <h2 className="inline">
            <span className="inline bg-white text-transparent bg-clip-text">
              Effortless{" "}
              <span className="inline-flex items-center">
                <TypewriterEffectSmooth words={words} />
              </span>
            </span>
          </h2>
        </main>
        <p className="text-base sm:text-lg text-muted-foreground text-center lg:text-left sm:mx-auto lg:mx-0 lg:w-10/12">
          Instantly create personalized resumes and cover letters tailored to
          every job opportunity, all in just a few clicks.
        </p>
        <div className="flex justify-center lg:justify-start">
          <Link to="/auth">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="button"
              className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
            >
              <span>Getting Started</span>
            </HoverBorderGradient>
          </Link>
        </div>
      </div>

      <PinContainer title="/garuda.resume.build" href="/">
        <div className="flex basis-full flex-col px-4 tracking-tight text-slate-100/50 sm:basis-1/2 w-[20rem] h-[20rem]">
          <h3 className="max-w-xs !pb-2 !m-0 font-bold text-base text-slate-100">
            Garuda
          </h3>
          <div className="text-base !m-0 !p-0 font-normal">
            <span className="text-slate-500 ">Build and grow!</span>
          </div>
          {/* Added sample resume image */}
          <img
            src={Resumes}
            alt="Sample Resume"
            className="w-full h-auto rounded-lg shadow-md p-4"
          />
        </div>
      </PinContainer>
    </div>
  );
};

export default HeroSection;