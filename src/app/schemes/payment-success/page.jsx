"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SchemePaymentSuccessPage() {
  const router = useRouter();
  const user = useSelector((state) => state.user.user);
  const [enrollment, setEnrollment] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push("/schemes");
      return;
    }

    // Retrieve enrollment data
    const stored = sessionStorage.getItem("scheme_enrollment");
    if (stored) {
      try {
        setEnrollment(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse enrollment data");
      }
    }
  }, [user, router]);

  const handleViewMySchemes = () => {
    // Clear session storage
    sessionStorage.removeItem("scheme_enrollment");
    // Redirect to admin/schemes page
    router.push("/admin/schemes");
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-green-500" strokeWidth={1} />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Enrollment Successful!
          </h1>

          <p className="text-gray-600 mb-8 text-lg">
            Your Vault of Dreams scheme enrollment has been completed successfully.
          </p>

          {/* Details Card */}
          {enrollment && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4 uppercase">
                Your Enrollment Details
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Amount</span>
                  <span className="font-semibold">
                    ₹{enrollment.amount?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Months</span>
                  <span className="font-semibold">9 Months</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Investment</span>
                  <span className="font-semibold">
                    ₹{(enrollment.amount * 9)?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-green-600 border-t pt-3">
                  <span className="font-semibold">Bonus Value</span>
                  <span className="font-bold">
                    ₹{enrollment.amount?.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between font-bold border-t pt-3">
                  <span>Total Benefit</span>
                  <span className="text-lg text-primary">
                    ₹{(enrollment.amount * 10)?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Nominee */}
              <div className="border-t mt-6 pt-6">
                <p className="font-semibold text-gray-900 mb-3 uppercase text-sm">
                  Nominee
                </p>
                <p className="text-gray-600">
                  {enrollment.nominee_name} (Age: {enrollment.nominee_age})
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h4 className="font-semibold text-gray-900 mb-4">What&apos;s Next?</h4>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
              <li>Your first payment has been initiated</li>
              <li>You will receive a confirmation email shortly</li>
              <li>
                Track your scheme progress in{" "}
                <Link href="/admin/schemes" className="text-primary font-semibold hover:underline">
                  My Schemes
                </Link>
              </li>
              <li>Pay your monthly installments before the due date</li>
              <li>Complete 9 months and claim your 10th month bonus!</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleViewMySchemes}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider rounded-lg"
            >
              View My Schemes
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full h-12 border-2 border-gray-300 text-gray-900 font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50"
            >
              Back to Home
            </Button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t text-sm text-gray-600">
            <p>
              Need help? Contact our customer support at{" "}
              <a href="tel:+918976773659" className="text-primary font-semibold">
                +91-8976-773-659
              </a>{" "}
              or email{" "}
              <a href="mailto:support@lucirajewelry.com" className="text-primary font-semibold">
                support@lucirajewelry.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
