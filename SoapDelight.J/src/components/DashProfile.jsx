import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  updateFailure,
  updateStart,
  updateSuccess,
} from "../redux/user/userSlice";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiBase";

const inputClassName =
  "mt-2 block min-h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white";

const InfoMessage = ({ tone = "neutral", children }) => {
  const tones = {
    neutral:
      "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    error:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
};

const DashProfile = () => {
  const { currentUser, error, loading } = useSelector((state) => state.user);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileUrl, setImageFileUrl] = useState(null);
  const [imageFileUploadProgress, setImageFileUploadProgress] = useState(null);
  const [imageFileUploadError, setImageFileUploadError] = useState(null);
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [updateUserSuccess, setUpdateUserSuccess] = useState(null);
  const [updateUserError, setUpdateUserError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [subscriptionData, setSubscriptionData] = useState({
    emailChannel: false,
    whatsappChannel: false,
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const filePickerRef = useRef();
  const previewObjectUrlRef = useRef(null);
  const isMountedRef = useRef(true);
  const dispatch = useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (previewObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (imageFile) {
      uploadImage();
    }
  }, [imageFile]);

  useEffect(() => {
    if (!currentUser) return;

    setFormData((prev) => ({
      ...prev,
      username:
        Object.prototype.hasOwnProperty.call(prev, "username")
          ? prev.username
          : currentUser.username || "",
      email:
        Object.prototype.hasOwnProperty.call(prev, "email")
          ? prev.email
          : currentUser.email || "",
      phone:
        Object.prototype.hasOwnProperty.call(prev, "phone")
          ? prev.phone
          : currentUser.phone || "",
      password:
        Object.prototype.hasOwnProperty.call(prev, "password")
          ? prev.password
          : "",
    }));
  }, [currentUser?._id]);

  useEffect(() => {
    if (!currentUser?.email) return;

    let shouldIgnore = false;

    const loadSubscriptionStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/subscribers/status?email=${encodeURIComponent(currentUser.email)}`
        );
        const data = await response.json();

        if (!response.ok || shouldIgnore) return;

        const preferredChannels = Array.isArray(data.preferredChannels)
          ? data.preferredChannels
          : [];
        const isActive = data.status === "active";

        setSubscriptionData({
          emailChannel: isActive && preferredChannels.includes("email"),
          whatsappChannel: isActive && preferredChannels.includes("whatsapp"),
        });

        if (data.phone) {
          setFormData((prev) => ({
            ...prev,
            phone: prev.phone?.trim() ? prev.phone : data.phone,
          }));
        }
      } catch {
        if (!shouldIgnore) {
          setSubscriptionData({
            emailChannel: false,
            whatsappChannel: false,
          });
        }
      }
    };

    loadSubscriptionStatus();

    return () => {
      shouldIgnore = true;
    };
  }, [currentUser?.email]);

  const uploadImage = async () => {
    setImageFileUploading(true);
    setImageFileUploadError(null);
    setImageFileUploadProgress(null);

    const uploadPreset = import.meta.env.VITE_REACT_APP_UPLOAD_PRESET;
    const url = "https://api.cloudinary.com/v1_1/dozg9wdh1/image/upload";

    if (!uploadPreset) {
      if (!isMountedRef.current) return;
      setImageFileUploadError("Could not upload image: missing upload preset.");
      setImageFileUploading(false);
      setImageFile(null);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", imageFile);
      form.append("upload_preset", uploadPreset);
      form.append("folder", "soapdelight-avatar");

      const response = await fetch(url, {
        method: "POST",
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error?.message || data?.message || "Unknown error";
        throw new Error(`Could not upload image: ${message}`);
      }

      if (!isMountedRef.current) return;
      if (previewObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = null;

      setImageFileUrl(data.secure_url);
      setFormData((prev) => ({ ...prev, profilePicture: data.secure_url }));
      setImageFileUploadProgress(100);
      setImageFileUploadError(null);
      setImageFileUploading(false);
      setImageFile(null);
    } catch (uploadError) {
      if (!isMountedRef.current) return;
      if (previewObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      previewObjectUrlRef.current = null;
      const message =
        uploadError?.message?.startsWith("Could not upload image:")
          ? uploadError.message
          : "Could not upload image. Please try again.";
      setImageFileUploadError(message);
      setImageFileUploadProgress(null);
      setImageFile(null);
      setImageFileUrl(null);
      setImageFileUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    if (!file.type?.startsWith("image/")) {
      setImageFileUploadError("Please select an image file.");
      setImageFileUploadProgress(null);
      setImageFile(null);
      setImageFileUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageFileUploadError("Image must be less than 5MB.");
      setImageFileUploadProgress(null);
      setImageFile(null);
      setImageFileUploading(false);
      return;
    }

    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = previewUrl;

    setImageFileUploadError(null);
    setImageFileUploadProgress(null);
    setImageFileUploading(false);
    setImageFile(file);
    setImageFileUrl(previewUrl);
    setAvatarLoadFailed(false);
    e.target.value = "";
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubscriptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubscriptionData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const getPreferredChannels = (phone) => {
    const channels = [];
    if (subscriptionData.emailChannel) channels.push("email");
    if (subscriptionData.whatsappChannel && phone.trim()) {
      channels.push("whatsapp");
    }
    return channels;
  };

  const syncSubscriptionPreferences = async ({ email, username, phone }) => {
    const preferredChannels = getPreferredChannels(phone);

    if (subscriptionData.whatsappChannel && !phone.trim()) {
      throw new Error("Please enter a phone number to receive WhatsApp updates.");
    }

    setSubscriptionLoading(true);

    try {
      if (preferredChannels.length === 0) {
        const response = await fetch(`${API_BASE_URL}/subscribers/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to unsubscribe.");
        }

        return data.message || "Subscription preferences saved.";
      }

      const response = await fetch(`${API_BASE_URL}/subscribers/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: username,
          phone,
          preferredChannels,
          source: "account",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save subscription preferences.");
      }

      return data.message || "Subscription preferences saved.";
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateUserError(null);
    setUpdateUserSuccess(null);

    if (imageFileUploading) {
      setUpdateUserError("Please wait for image to upload");
      return;
    }

    const hasFormValue = (key) => Object.prototype.hasOwnProperty.call(formData, key);
    const effectiveUsername = hasFormValue("username") ? formData.username : currentUser.username;
    const effectiveEmail = hasFormValue("email") ? formData.email : currentUser.email;
    const effectivePhone = hasFormValue("phone") ? formData.phone : currentUser.phone || "";
    let profileUpdated = false;

    try {
      const profilePayload = {};
      if (effectiveUsername !== currentUser.username) {
        profilePayload.username = effectiveUsername;
      }
      if (effectiveEmail !== currentUser.email) {
        profilePayload.email = effectiveEmail;
      }
      if (effectivePhone !== (currentUser.phone || "")) {
        profilePayload.phone = effectivePhone;
      }
      if (formData.password?.trim()) {
        profilePayload.password = formData.password;
      }
      if (
        formData.profilePicture &&
        formData.profilePicture !== currentUser.profilePicture
      ) {
        profilePayload.profilePicture = formData.profilePicture;
      }

      if (Object.keys(profilePayload).length > 0) {
        dispatch(updateStart());
        const res = await fetch(`/api/user/update/${currentUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profilePayload),
        });
        const data = await res.json();

        if (profilePayload.email) {
          await fetch("/api/auth/sendVerificationEmail", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: profilePayload.email }),
          });
        }

        if (!res.ok) {
          dispatch(updateFailure(data.message));
          setUpdateUserError(data.message);
          return;
        }

        dispatch(updateSuccess(data));
        profileUpdated = true;
      }

      try {
        await syncSubscriptionPreferences({
          email: effectiveEmail,
          username: effectiveUsername,
          phone: effectivePhone,
        });
      } catch (subscriptionError) {
        setUpdateUserError(
          profileUpdated
            ? `Your profile was updated, but subscription preferences could not be saved: ${subscriptionError.message}`
            : subscriptionError.message
        );
        return;
      }

      if (profileUpdated) {
        setUpdateUserSuccess("Your profile and subscription preferences have been updated.");
      } else {
        setUpdateUserSuccess("Your subscription preferences have been updated.");
      }
    } catch (submitError) {
      dispatch(updateFailure(submitError.message));
      setUpdateUserError(submitError.message);
    }
  };

  const handleDeleteUser = async () => {
    setShowDeleteModal(false);
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(deleteUserFailure(data.message));
      } else {
        dispatch(deleteUserSuccess(data));
      }
    } catch (deleteError) {
      dispatch(deleteUserFailure(deleteError.message));
    }
  };

  if (!currentUser) {
    return (
      <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Sign in to view your account.
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          登入後即可查看個人資料、更新聯絡方式，以及管理你的帳戶。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/sign-in"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Sign In
          </Link>
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const profileInitial = (currentUser.username || currentUser.email || "S")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={filePickerRef}
              hidden
            />
            <button
              type="button"
              className="relative h-28 w-28 overflow-hidden rounded-full border border-zinc-200 bg-[#f7f8f4] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              onClick={() => filePickerRef.current?.click()}
              aria-label="Upload profile photo"
            >
              {imageFileUploadProgress && (
                <CircularProgressbar
                  value={imageFileUploadProgress || 0}
                  text={`${imageFileUploadProgress}%`}
                  strokeWidth={5}
                  styles={{
                    root: {
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      inset: 0,
                    },
                    path: {
                      stroke: `rgba(24, 24, 27, ${imageFileUploadProgress / 100})`,
                    },
                    trail: {
                      stroke: "rgba(228, 228, 231, 0.6)",
                    },
                    text: {
                      fill: "#18181b",
                      fontSize: "20px",
                    },
                  }}
                />
              )}

              {(imageFileUrl || currentUser.profilePicture) && !avatarLoadFailed ? (
                <img
                  src={imageFileUrl || currentUser.profilePicture}
                  alt="User profile"
                  onError={() => setAvatarLoadFailed(true)}
                  className={`h-full w-full object-cover ${
                    imageFileUploadProgress &&
                    imageFileUploadProgress < 100 &&
                    "opacity-60"
                  }`}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-500 dark:text-zinc-300">
                  {profileInitial}
                </span>
              )}
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Account overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {currentUser.username}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {currentUser.email}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {currentUser.role || "customer"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    currentUser.isVerified
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {currentUser.isVerified ? "Verified" : "Email not verified"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {imageFileUploadError && <InfoMessage tone="error">{imageFileUploadError}</InfoMessage>}
      {updateUserSuccess && <InfoMessage tone="success">{updateUserSuccess}</InfoMessage>}
      {updateUserError && <InfoMessage tone="error">{updateUserError}</InfoMessage>}
      {error && <InfoMessage tone="error">{error}</InfoMessage>}

      <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <div className="flex flex-col gap-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
              Account details / 帳戶資料
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Update your profile, contact details and subscription preferences in one place.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              Profile
            </h3>
            <div className="mt-4 grid gap-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  placeholder="Username"
                  value={formData.username ?? currentUser.username ?? ""}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Leave blank to keep your current password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-[#fbfcfa] px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Profile photo
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  Click your avatar above to upload a new image.
                </p>
              </div>
            </div>
          </section>

          <section className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              Contact
            </h3>
            <div className="mt-4 grid gap-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={formData.email ?? currentUser.email ?? ""}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  placeholder="Phone number"
                  value={formData.phone ?? currentUser.phone ?? ""}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>

              {!currentUser.isVerified && (
                <InfoMessage tone="neutral">
                  Your email is not verified yet. Updating your email will send a new verification email.
                </InfoMessage>
              )}
            </div>
          </section>

          <section className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              Subscription preferences / 訂閱設定
            </h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              Use your email and/or phone number above to receive product updates, offers and occasional promotions.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-[#fbfcfa] px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                  type="checkbox"
                  name="emailChannel"
                  checked={subscriptionData.emailChannel}
                  onChange={handleSubscriptionChange}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>Email updates</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-[#fbfcfa] px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <input
                  type="checkbox"
                  name="whatsappChannel"
                  checked={subscriptionData.whatsappChannel}
                  onChange={handleSubscriptionChange}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>WhatsApp updates</span>
              </label>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-auto"
            disabled={loading || imageFileUploading || subscriptionLoading}
          >
            {loading || subscriptionLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <section className="rounded-[1.5rem] border border-zinc-200 bg-white px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Danger zone / 危險操作
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            Deleting your account is permanent and cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            Delete Account
          </button>
        </div>
      </section>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Delete your account?
            </h3>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              This action can’t be undone. If you still want to continue, we’ll
              remove your account and sign you out.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashProfile;
