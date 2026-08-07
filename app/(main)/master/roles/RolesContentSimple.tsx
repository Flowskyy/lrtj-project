"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Role {
  id: number;
  name: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    role_permissions: number;
  };
}

interface RolesContentProps {
  username: string;
}

export default function RolesContentSimple({ username }: RolesContentProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("RolesContentSimple mounted");
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    console.log("Fetching roles...");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roles");
      console.log("Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Roles data:", data);
        setRoles(data);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch roles:", errorText);
        setError(`Failed to fetch: ${res.status} - ${errorText}`);
      }
    } catch (err) {
      console.error("Failed to fetch roles", err);
      setError("Network error fetching roles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user roles and page access permissions</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">Error: {error}</p>
            <button 
              onClick={fetchRoles}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-4">
            <p>Loading roles...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Roles ({roles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <p className="text-gray-500">No roles found</p>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{role.name}</span>
                      {role.isSuperAdmin && (
                        <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {role._count.role_permissions} permissions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
