"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AccountConfirmedToast() {
  const searchParams = useSearchParams();
  const [validParams, setValidParams] = useState(false);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (tokenHash && type) {
      setValidParams(true);
      toast.success("Account confirmed!");
    }
  }, [validParams]);

  return <></>;
}
