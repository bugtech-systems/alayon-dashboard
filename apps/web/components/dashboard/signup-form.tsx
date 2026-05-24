"use client";

import { signup } from "@/lib/actions";
import { Badge, Button, Input, Label, Select } from "@medusajs/ui";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";

function Submit() {
  const status = useFormStatus();

  return (
    <Button
      type="submit"
      size="large"
      className="self-end"
      isLoading={status.pending}
    >
      Create account
    </Button>
  );
}

const userTypes = [
  { value: "driver", label: "Driver" },
  { value: "company", label: "Company" },
];

export function SignupForm({
  companies = [],
}: {
  companies: any;
}) {
  const [state, action] = useActionState(signup, { message: "" });
  
  // Initialize userType from localStorage or default to "driver"
  const [userType, setUserType] = useState<string>("driver");
  
  // Load from localStorage on mount
  useEffect(() => {
    const savedUserType = localStorage.getItem("signup_user_type");
    if (savedUserType && (savedUserType === "driver" || savedUserType === "company")) {
      setUserType(savedUserType);
    }
  }, []);
  
  // Save to localStorage whenever userType changes
  const handleUserTypeChange = (value: string) => {
    setUserType(value);
    console.log(value, 'VALL')
    if(value){
    localStorage.setItem("signup_user_type", value);
    }
  };

  return (
    <form action={action} className="flex flex-col gap-4 max-w-96">
      <div className="flex flex-col gap-2">
        <div>
          <Select
            name="user_type"
            value={userType}
            onValueChange={handleUserTypeChange}
          >
            <Select.Trigger>
              <Select.Value placeholder="I'm a..." />
            </Select.Trigger>
            <Select.Content>
              {userTypes.map((item) => (
                <Select.Item key={item.value} value={item.value}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        
        {userType === "company" && (
          <div>
            <Select name="company_id">
              <Select.Trigger>
                <Select.Value placeholder="Select company" />
              </Select.Trigger>
              <Select.Content>
                {companies.map((company: any) => (
                  <Select.Item key={company.id} value={company.id}>
                    {company.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        )}
        
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            placeholder="First Name"
          />
        </div>
        
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            placeholder="Last Name"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone (required)"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            required
          />
        </div>
      </div>
      
      <div className="flex flex-row justify-between">
        <Link href="/login">
          <Button variant="transparent" size="large">
            Log in
          </Button>
        </Link>
        <Submit />
      </div>
      
      {state?.message && (
        <Badge className="justify-center text-center" variant="red">
          {state.message}
        </Badge>
      )}
    </form>
  );
}