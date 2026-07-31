import { Card } from "../../ui/Card";
import styles from "./AccountInformation.module.css";

type Props = {
  email: string;
  name?: string;
  createdAt?: string;
};

export function AccountInformation({ email, name, createdAt }: Props) {
  const dateStr = createdAt
    ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(createdAt))
    : undefined;

  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>Данные аккаунта</h2>
      <dl className={styles.list}>
        <div>
          <dt>Email</dt>
          <dd aria-readonly="true">{email}</dd>
        </div>
        {name && (
          <div>
            <dt>Имя</dt>
            <dd aria-readonly="true">{name}</dd>
          </div>
        )}
        {dateStr && (
          <div>
            <dt>Дата регистрации</dt>
            <dd aria-readonly="true">{dateStr}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
