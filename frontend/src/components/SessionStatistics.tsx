import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sessionsApi, type Session } from '../api/api';

export default function SessionDetail() {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        if (id) sessionsApi.getById(id).then(setSession);
    }, [id]);

    if (!session) return null;

    return <div>{session.title}</div>;
}
