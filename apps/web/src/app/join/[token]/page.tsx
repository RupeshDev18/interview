import { redirect } from 'next/navigation';

export default function JoinRedirectPage({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/interview/join/${params.token}`);
}
