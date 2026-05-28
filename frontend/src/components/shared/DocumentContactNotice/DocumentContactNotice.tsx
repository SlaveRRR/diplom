import { Alert, Typography } from 'antd';

import { SUPPORT_EMAIL } from '@constants/support';

const { Link } = Typography;

export const DocumentContactNotice = () => (
  <Alert
    type="info"
    showIcon
    message="Остались вопросы?"
    description={
      <span className="flex gap-1">
        Напишите нам на почту
        <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link>
      </span>
    }
  />
);
