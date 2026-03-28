import React, { useState } from "react";
import {
  X,
  Cloud,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Rocket,
  LineChart,
} from "lucide-react";
import { Tooltip } from "./Tooltip";
import { MyProductData } from "./MyProduct";

interface DeploymentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  myProductData: MyProductData;
}

export const DeploymentWizardModal: React.FC<DeploymentWizardModalProps> = ({
  isOpen,
  onClose,
  myProductData,
}) => {
  const [step, setStep] = useState<"oauth" | "deploying" | "success">("oauth");
  const [isConnecting, setIsConnecting] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<number>(0);

  if (!isOpen) return null;

  const handleOAuthConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setStep("deploying");
      simulateDeployment();
    }, 2000);
  };

  const simulateDeployment = () => {
    let currentStatus = 0;
    const interval = setInterval(() => {
      currentStatus += 1;
      setDeploymentStatus(currentStatus);
      if (currentStatus >= 4) {
        clearInterval(interval);
        setStep("success");
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-paper-light rounded-2xl w-full max-w-2xl shadow-2xl border border-ink-dark/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-dark/20 bg-paper-base">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Cloud className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-dark">
                Deploy to Cloudflare Pages
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                Seamlessly deploy your Validation Spec.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink-dark transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {step === "oauth" && (
            <div className="text-center py-8">
              <h3 className="text-lg font-bold text-ink-dark mb-4">
                Connect your Cloudflare Account
              </h3>
              <p className="text-sm text-ink-muted mb-8 max-w-md mx-auto">
                Authorize NicheAI to deploy your React/Next.js application to
                Cloudflare Pages edge and automatically provision Web Analytics
                for your fake door smoke test.
              </p>
              <button
                onClick={handleOAuthConnect}
                disabled={isConnecting}
                className="mx-auto flex items-center gap-2 px-6 py-3 bg-[#F38020] text-white font-bold rounded-lg hover:bg-[#d6701c] transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Cloud size={20} />
                )}
                {isConnecting ? "Connecting..." : "Connect with Cloudflare"}
              </button>
            </div>
          )}

          {step === "deploying" && (
            <div className="py-8">
              <h3 className="text-lg font-bold text-ink-dark mb-6 text-center">
                Deployment Checklist
              </h3>
              <div className="space-y-4 max-w-sm mx-auto">
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border ${deploymentStatus >= 1 ? "border-sky/30 bg-sky/5" : "border-ink-dark/10 bg-paper-base"}`}
                >
                  {deploymentStatus >= 1 ? (
                    <CheckCircle2 className="text-sky" size={20} />
                  ) : (
                    <Loader2
                      className="text-ink-muted animate-spin"
                      size={20}
                    />
                  )}
                  <span
                    className={
                      deploymentStatus >= 1
                        ? "text-ink-dark font-medium"
                        : "text-ink-muted"
                    }
                  >
                    Securing domain
                  </span>
                </div>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border ${deploymentStatus >= 2 ? "border-sky/30 bg-sky/5" : "border-ink-dark/10 bg-paper-base"}`}
                >
                  {deploymentStatus >= 2 ? (
                    <CheckCircle2 className="text-sky" size={20} />
                  ) : deploymentStatus >= 1 ? (
                    <Loader2 className="text-sky animate-spin" size={20} />
                  ) : (
                    <div className="w-5 h-5 border-2 border-ink-dark/10 rounded-full" />
                  )}
                  <span
                    className={
                      deploymentStatus >= 2
                        ? "text-ink-dark font-medium"
                        : deploymentStatus >= 1
                          ? "text-ink-dark"
                          : "text-ink-muted"
                    }
                  >
                    Provisioning Analytics
                  </span>
                </div>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border ${deploymentStatus >= 3 ? "border-sky/30 bg-sky/5" : "border-ink-dark/10 bg-paper-base"}`}
                >
                  {deploymentStatus >= 3 ? (
                    <CheckCircle2 className="text-sky" size={20} />
                  ) : deploymentStatus >= 2 ? (
                    <Loader2 className="text-sky animate-spin" size={20} />
                  ) : (
                    <div className="w-5 h-5 border-2 border-ink-dark/10 rounded-full" />
                  )}
                  <span
                    className={
                      deploymentStatus >= 3
                        ? "text-ink-dark font-medium"
                        : deploymentStatus >= 2
                          ? "text-ink-dark"
                          : "text-ink-muted"
                    }
                  >
                    Building Application
                  </span>
                </div>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg border ${deploymentStatus >= 4 ? "border-sky/30 bg-sky/5" : "border-ink-dark/10 bg-paper-base"}`}
                >
                  {deploymentStatus >= 4 ? (
                    <CheckCircle2 className="text-sky" size={20} />
                  ) : deploymentStatus >= 3 ? (
                    <Loader2 className="text-sky animate-spin" size={20} />
                  ) : (
                    <div className="w-5 h-5 border-2 border-ink-dark/10 rounded-full" />
                  )}
                  <span
                    className={
                      deploymentStatus >= 4
                        ? "text-ink-dark font-medium"
                        : deploymentStatus >= 3
                          ? "text-ink-dark"
                          : "text-ink-muted"
                    }
                  >
                    Deploying to Global Edge
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping opacity-20"></div>
                <Rocket size={40} className="text-green-600 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-ink-dark mb-2">
                Deployed Successfully!
              </h3>
              <p className="text-sm text-ink-muted mb-8">
                Your validation landing page is now live globally.
              </p>

              <div className="bg-paper-base border border-ink-dark/20 p-6 rounded-xl mb-8 flex flex-col items-center">
                <div className="relative flex items-center justify-center mb-4">
                  <div className="absolute w-32 h-32 border border-sky/30 rounded-full animate-[ping_3s_ease-out_infinite]" />
                  <div className="absolute w-24 h-24 border border-sky/40 rounded-full animate-[ping_3s_ease-out_infinite_1s]" />
                  <div className="absolute w-16 h-16 border border-sky/50 rounded-full animate-[ping_3s_ease-out_infinite_2s]" />
                  <LineChart size={24} className="text-sky relative z-10" />
                </div>
                <p className="font-medium text-ink-dark">
                  Listening for your first visitor...
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Analytics are provisioned and awaiting traffic.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-ink-dark/20 text-ink-dark font-medium rounded-lg hover:bg-paper-base transition-colors"
                >
                  Close
                </button>
                <a
                  href={`https://${myProductData.name?.toLowerCase().replace(/\s+/g, "-") || "demo"}.pages.dev`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-ink-dark text-white font-bold rounded-lg hover:bg-black transition-colors"
                >
                  Visit live site
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
