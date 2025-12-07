import { useNotificationGenerator } from '../hooks/useNotificationGenerator.jsx';

/**
 * This component's sole purpose is to activate the notification generation logic.
 * It doesn't render any UI itself.
 */
const NotificationController = () => {
    useNotificationGenerator();
    return null;
};

export default NotificationController;
