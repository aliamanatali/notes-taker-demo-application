import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser } from "@/utils/api";
import { showSuccess, showError } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Star, Mail, Lock, UserPlus, LogIn } from "lucide-react";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      });
      await login(response.access_token);
      showSuccess("Welcome back to the Archives!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registerForm.email ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      showError("Please fill in all fields");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (registerForm.password.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        email: registerForm.email,
        password: registerForm.password,
      });

      // Auto-login after successful registration
      const loginResponse = await loginUser({
        email: registerForm.email,
        password: registerForm.password,
      });
      await login(loginResponse.access_token);
      showSuccess("Account created successfully! Welcome to the Archives!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Archive className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">Galactic Archives</h1>
            <Star className="w-6 h-6 text-orange-400 ml-3" />
          </div>
          <p className="text-blue-300 text-lg">
            Access your personal collection of Holocrons
          </p>
        </div>

        <Card className="bg-gray-800 border-blue-500">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Enter the Archives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="login"
                  className="text-white data-[state=active]:bg-blue-600"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-white data-[state=active]:bg-blue-600"
                >
                  Join Archives
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Accessing Archives..."
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            email: e.target.value,
                          })
                        }
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                      <Input
                        type="password"
                        placeholder="Password (min. 6 characters)"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            password: e.target.value,
                          })
                        }
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={registerForm.confirmPassword}
                        onChange={(e) =>
                          setRegisterForm({
                            ...registerForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-400 focus:ring-orange-400"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Archives
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
