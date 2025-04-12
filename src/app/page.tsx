import { SignOutButton } from "@clerk/nextjs";

export default function Home() {

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"join" | "start">("join");


  return (
    <div>
      <SignOutButton />
    </div>
  );

}
