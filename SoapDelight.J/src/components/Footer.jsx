import { Link } from "react-router-dom";
import { BsFacebook } from "react-icons/bs";

export default function FooterCom() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/" className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              SoapDelight.J
            </Link>
          </div>

          <p className="text-sm text-zinc-500 md:text-center">
            © {new Date().getFullYear()} SoapDelight.J. 版權所有。
          </p>

          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/profile.php?id=61555597584696"
              className="transition hover:text-zinc-950 dark:hover:text-white"
              aria-label="SoapDelight.J Facebook"
              target="_blank"
              rel="noreferrer"
            >
              <BsFacebook size={18} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
