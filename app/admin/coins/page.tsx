"use client";

import { useState } from "react";
import { Card } from "../../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, Plus, Minus } from "lucide-react";

const CoinManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - ในการใช้งานจริงจะดึงจาก API
  const transactions = [
    {
      id: 1,
      userId: "user123",
      username: "john_doe",
      type: "add",
      amount: 100,
      reason: "ซื้อเหรียญ",
      date: "2024-12-14",
    },
    {
      id: 2,
      userId: "user456",
      username: "jane_smith",
      type: "subtract",
      amount: 50,
      reason: "ใช้ส่งการบ้าน",
      date: "2024-12-14",
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">จัดการเหรียญ</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> เพิ่มเหรียญ
            </Button>
            <Button variant="outline" className="gap-2">
              <Minus className="w-4 h-4" /> หักเหรียญ
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาด้วยชื่อผู้ใช้หรือ ID..."
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
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">จำนวนเหรียญ</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      วันที่
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.userId}
                    </TableCell>
                    <TableCell>{transaction.username}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          transaction.type === "add"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.type === "add" ? "เพิ่ม" : "หัก"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.amount}
                    </TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
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

export default CoinManagement;
