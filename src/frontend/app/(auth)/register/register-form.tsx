import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RegisterStep1FormValues,
  RegisterStep2FormValues,
  RegisterStep3FormValues,
} from '@/lib/validations/auth';
import { RegisterFormStep1 } from '@/app/(auth)/register/register-form-step1';
import { RegisterFormStep2 } from '@/app/(auth)/register/register-form-step2';
import { RegisterFormStep3 } from '@/app/(auth)/register/register-form-step3';
import { authApi } from '@/lib/api/auth';
import { AlertCircle } from 'lucide-react';

// Импортируем компонент Alert из UI библиотеки
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Тип, соответствующий данным, собираемым на всех этапах регистрации
interface CombinedFormData {
  email?: string;
  password?: string;
  confirmPassword?: string; // Нужно для первого шага
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  agreeToTerms?: boolean;
}

export function RegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CombinedFormData>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Обработчик первого шага
  const handleStep1 = (data: RegisterStep1FormValues) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
  };

  // Обработчик второго шага
  const handleStep2 = (data: RegisterStep2FormValues) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
  };

  // Обработчик третьего шага
  const handleStep3 = async (data: RegisterStep3FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      // Собираем все данные из всех шагов
      const registerData = {
        email: formData.email || '',
        password: formData.password || '',
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        phoneNumber: formData.phoneNumber || '',
        agreeToTerms: data.agreeToTerms,
      };

      const response = await authApi.register(registerData);

      // Сохраняем токены для автоматической авторизации
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Перенаправляем на главную страницу или страницу приветствия
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик для возврата к предыдущему шагу
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  // Приведение типов для каждого шага
  const getStep1Values = (): RegisterStep1FormValues => ({
    email: formData.email || '',
    password: formData.password || '',
    confirmPassword: formData.confirmPassword || '',
  });

  const getStep2Values = (): RegisterStep2FormValues => ({
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    phoneNumber: formData.phoneNumber || '',
  });

  const getStep3Values = (): RegisterStep3FormValues => ({
    agreeToTerms: formData.agreeToTerms || false,
  });

  return (
    <div className="w-full max-w-md space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentStep === 1 && (
        <RegisterFormStep1
          onNext={handleStep1}
          defaultValues={getStep1Values()}
          isLoading={isLoading}
        />
      )}

      {currentStep === 2 && (
        <RegisterFormStep2
          onNext={handleStep2}
          onBack={handleBack}
          defaultValues={getStep2Values()}
          isLoading={isLoading}
        />
      )}

      {currentStep === 3 && (
        <RegisterFormStep3
          onNext={handleStep3}
          onBack={handleBack}
          defaultValues={getStep3Values()}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
