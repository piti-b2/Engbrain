"use client"

import { useUser, SignOutButton } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/context/LanguageContext"
import { translations } from "@/translations"
import { Badge } from "@/components/ui/badge"
import {
  UserCircle,
  History,
  HelpCircle,
  Book,
  AlertCircle,
  MessageCircle,
  LogOut,
  Star
} from "lucide-react"

export function UserProfileMenu() {
  const { user } = useUser()
  const { language } = useLanguage()
  const t = translations[language]

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full bg-secondary p-2 hover:bg-secondary/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                Lv.5
              </Badge>
              <Badge variant="outline">{t.freeMember}</Badge>
            </div>
          </div>
          <div className="h-8 w-8 rounded-full overflow-hidden">
            {user.imageUrl && (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.emailAddresses[0].emailAddress}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserCircle className="mr-2 h-4 w-4" />
            <span>{t.editProfile}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <History className="mr-2 h-4 w-4" />
            <span>{t.learningHistory}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>{t.helpCenter}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Book className="mr-2 h-4 w-4" />
            <span>{t.userGuide}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{t.reportProblem}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>{t.contactUs}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton signOutCallback={() => {
          window.location.href = "/";
        }}>
          <DropdownMenuItem className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t.signOut}</span>
          </DropdownMenuItem>
        </SignOutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
