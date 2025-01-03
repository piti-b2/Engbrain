"use client";

import { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Search, ArrowUpDown, Shield, Ban } from "lucide-react";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - ในการใช้งานจริงจะดึงจาก API
  const users = [
    {
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      coins: 150,
      status: "active",
      joinDate: "2024-01-01",
    },
    {
      id: "user456",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "admin",
      coins: 300,
      status: "active",
      joinDate: "2024-01-15",
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" /> จัดการสิทธิ์
            </Button>
            <Button variant="outline" className="gap-2">
              <Ban className="w-4 h-4" /> ระงับผู้ใช้
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วยชื่อ, อีเมล หรือ ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สิทธิ์</TableHead>
                  <TableHead className="text-right">เหรียญ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      วันที่สมัคร
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{user.coins}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        แก้ไข
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
