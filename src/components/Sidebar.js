"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Alert,
  Input,
  Drawer,
  Card,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  HomeIcon,
  IdentificationIcon,
  PowerIcon,
  PresentationChartLineIcon,
  UserIcon,
} from "@heroicons/react/24/solid";

export default function Sidebar() {
  // const pathname = usePathname();
  // const isActive = (path) => path === pathname;
  return (
    <Card className="h-[calc(100vh-2rem)] w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5">
      <div className="mb-2 p-4 ">
        <Typography
          className="playfair-disply-font font-extrabold"
          variant="h5"
          color="blue-gray"
        >
          Qode
        </Typography>
      </div>
      <List>
        <Link href={"/"}>
          <ListItem>
            <ListItemPrefix>
              <HomeIcon className="h-5 w-5" />
            </ListItemPrefix>
            Home
          </ListItem>
        </Link>
        <Link href={"/portfolio"}>
          <ListItem>
            <ListItemPrefix>
              <PresentationChartLineIcon className="h-5 w-5" />
            </ListItemPrefix>
            Portfolio
          </ListItem>
        </Link>
        <Link href={"/account"}>
          <ListItem>
            <ListItemPrefix>
              <UserIcon className="h-5 w-5" />
            </ListItemPrefix>
            Account
            <ListItemSuffix>
              {/* <Chip
              value="14"
              size="sm"
              variant="ghost"
              color="blue-gray"
              className="rounded-full"
            /> */}
            </ListItemSuffix>
          </ListItem>
        </Link>
        {/* <ListItem>
          <ListItemPrefix>
            <UserCircleIcon className="h-5 w-5" />
          </ListItemPrefix>
          Profile
        </ListItem>
        <ListItem>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          Settings
        </ListItem> */}
        <ListItem>
          <ListItemPrefix>
            <PowerIcon className="h-5 w-5" />
          </ListItemPrefix>
          Log Out
        </ListItem>
      </List>
    </Card>
  );
}
