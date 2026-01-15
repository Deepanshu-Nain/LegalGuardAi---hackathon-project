import svgPaths from "./svg-ef0nhwgpva";
import { BackgroundMarquee } from "../app/components/BackgroundMarquee";
import { Scale } from "lucide-react";

function Field() {
  return (
    <div className="absolute contents left-[668px] top-[608px]" data-name="field 1">
      <div className="absolute border-3 border-solid border-white h-[126px] left-[668px] rounded-[100px] top-[608px] w-[584px]" />
      <p className="absolute font-['Poppins:Regular',sans-serif] leading-[normal] left-[723px] not-italic text-[#aaa] text-[30px] top-[645px] w-[298px] whitespace-pre-wrap">you@yourmail.com</p>
    </div>
  );
}

function EvaArrowIosForwardOutline() {
  return (
    <div className="absolute left-[850px] size-[31px] top-[798px]" data-name="eva:arrow-ios-forward-outline">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31 31">
        <g id="eva:arrow-ios-forward-outline">
          <path d={svgPaths.p3f254600} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Next() {
  return (
    <div className="absolute contents left-[718px] top-[769px]" data-name="next">
      <div className="absolute bg-[#4269e2] border-7 border-[#4269e2] border-solid h-[88px] left-[718px] rounded-[100px] top-[769px] w-[220px]" />
      <p className="absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-[781px] not-italic text-[30px] text-white top-[790px] whitespace-pre">Next</p>
      <EvaArrowIosForwardOutline />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[27.52%_47.89%_62.2%_47.5%]" data-name="Group">
      <Scale className="block size-full text-[#4269e2]" />
    </div>
  );
}

function StandardCollection() {
  return (
    <div className="absolute contents inset-[27.52%_47.89%_62.2%_47.5%]" data-name="Standard Collection 14">
      <Group />
    </div>
  );
}

function LoginSignup() {
  return (
    <div className="absolute contents left-[1333px] top-[98px]" data-name="login/signup">
      <div className="absolute bg-[#111] h-[95px] left-[1333px] rounded-[100px] top-[99px] w-[350px]" />
      <p className="absolute font-['Poppins:Bold',sans-serif] leading-[normal] left-[1548px] lowercase not-italic text-[#abc0ff] text-[20px] top-[131px] whitespace-pre">SIGNUP</p>
      <div className="absolute bg-[#4269e2] h-[95px] left-[1333px] rounded-[100px] top-[98px] w-[198px]" />
      <p className="absolute font-['Poppins:Bold',sans-serif] leading-[normal] left-[1393px] lowercase not-italic text-[30px] text-white top-[123px] whitespace-pre">LOGIN</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative size-full" data-name="login page">
      <BackgroundMarquee />
      <div className="absolute h-[795px] left-[-472px] top-[444px] w-[2864px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2864 795">
          <path clipRule="evenodd" d={svgPaths.p23ca7d80} fill="var(--fill-0, #4269E2)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="absolute bg-[#333] h-[827px] left-[calc(50%-0.5px)] rounded-[20px] shadow-[0px_109px_337px_0px_rgba(0,0,0,0.08),0px_45.538px_140.791px_0px_rgba(0,0,0,0.12),0px_24.347px_75.273px_0px_rgba(0,0,0,0.14),0px_13.648px_42.198px_0px_rgba(0,0,0,0.17),0px_7.249px_22.411px_0px_rgba(0,0,0,0.21),0px_3.016px_9.326px_0px_rgba(0,0,0,0.29)] top-[calc(50%+38px)] translate-x-[-50%] translate-y-[-50%] w-[771px]" />
      <p className="absolute font-['Poppins:Bold',sans-serif] leading-[normal] left-[798px] not-italic text-[#eee] text-[40px] top-[531px] whitespace-pre">Welcome Back</p>
      <Field />
      <Next />
      <p className="[text-decoration-skip-ink:none] absolute decoration-solid font-['Poppins:Regular',sans-serif] leading-[normal] left-[982px] lowercase not-italic text-[20px] text-white top-[798px] underline whitespace-pre">FORGOT PASSWORD</p>
      <StandardCollection />
      <LoginSignup />
    </div>
  );
}
