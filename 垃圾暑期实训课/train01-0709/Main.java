import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Scanner;

public class Main {

    /*全局静态变量：存储所有战队，static修饰表示所有对象共享 */
    public static ArrayList<Team> teams = new ArrayList<>();
    public static ArrayList<AbstractPlayer> players =
        new ArrayList<>(); /*存储所有玩家 */
    public static HashMap<Integer, MatchRecord> matchRecords =
        new HashMap<>(); /*存储所有对局记录，key为对局ID */
    public static HashSet<String> gameTypes =
        new HashSet<>(); /*存储所有游戏类型，自动去重 */

    public static void initData() {
        Team t1 = new Team(1, "哈基米南北路多", "王者荣耀");
        Team t2 = new Team(2, "大狗叫", "LOL");
        Team t3 = new Team(3, "叮咚鸡", "王者荣耀");
        teams.add(t1);
        teams.add(t2);
        teams.add(t3);

        Gamer g1 = new Gamer(101, "cy", 20, "王者荣耀");
        Gamer g2 = new Gamer(102, "qzh", 19, "LOL");
        Gamer g3 = new Gamer(103, "xzh", 21, "王者荣耀");
        players.add(g1);
        players.add(g2);
        players.add(g3);

        g1.joinTeam(1);
        g3.joinTeam(3);

        MatchAdmin admin = new MatchAdmin(999, "管理员", 25);
        players.add(admin);

        gameTypes.add("王者荣耀");
        gameTypes.add("LOL");

        MatchRecord record = new MatchRecord(1, 1, 3, 3, 0, "A胜");
        matchRecords.put(1, record);
        t1.addScore(3);

        System.out.println("系统初始化完成！");
        System.out.println(
            "预置数据: 3支战队、3名选手、1名管理员、1条对局记录"
        );
    }

    public static void gamerMenu(Gamer gamer) {
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\n选手功能菜单");
            System.out.println("1. 查看个人信息");
            System.out.println("2. 加入战队");
            System.out.println("3. 退出战队");
            System.out.println("4. 查询个人参赛记录");
            System.out.println("0. 返回主菜单");
            System.out.print("请选择操作: ");
            int choice = scanner.nextInt();

            switch (choice) {
                case 1:
                    gamer.showInfo();
                    break;
                case 2:
                    System.out.print("请输入战队ID: ");
                    int teamId = scanner.nextInt();
                    gamer.joinTeam(teamId);
                    break;
                case 3:
                    gamer.quitTeam();
                    break;
                case 4:
                    gamer.queryPersonalMatches();
                    break;
                case 0:
                    return;
                default:
                    System.out.println("无效选项，请重新选择！");
            }
        }
    }

    public static void adminMenu(MatchAdmin admin) {
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\n管理员功能菜单");
            System.out.println("1. 创建比赛对局");
            System.out.println("2. 按游戏分类统计积分");
            System.out.println("3. 查询系统全部对局记录");
            System.out.println("4. 拉黑/解除拉黑选手");
            System.out.println("0. 返回主菜单");
            System.out.print("请选择操作: ");
            int choice = scanner.nextInt();

            switch (choice) {
                case 1:
                    System.out.print("请输入战队A ID: ");
                    int teamAId = scanner.nextInt();
                    System.out.print("请输入战队B ID: ");
                    int teamBId = scanner.nextInt();
                    System.out.print("请输入比赛结果(A胜/B胜/平局P): ");
                    String result = scanner.next();
                    admin.createMatch(teamAId, teamBId, result);
                    break;
                case 2:
                    admin.statScoreByGame();
                    break;
                case 3:
                    admin.queryAllMatches();
                    break;
                case 4:
                    System.out.print("请输入选手ID: ");
                    int playerId = scanner.nextInt();
                    admin.blacklistPlayer(playerId);
                    break;
                case 0:
                    return;
                default:
                    System.out.println("无效选项，请重新选择！");
            }
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        initData();

        while (true) {
            System.out.println("\n校园电竞社团管理系统");
            System.out.println("请选择登录角色:");
            System.out.println("1. 参赛选手登录");
            System.out.println("2. 赛事管理员登录");
            System.out.println("0. 退出系统");
            System.out.print("请选择: ");
            int role = scanner.nextInt();

            if (role == 0) {
                System.out.println("感谢使用，再见！");
                break;
            }

            System.out.print("请输入您的编号: ");
            int id = scanner.nextInt();

            AbstractPlayer currentPlayer = null;
            for (AbstractPlayer p : players) {
                if (p.getId() == id) {
                    currentPlayer = p;
                    break;
                }
            }

            if (currentPlayer == null) {
                System.out.println("错误: 用户不存在！");
                continue;
            }

            if (role == 1) {
                if (!(currentPlayer instanceof Gamer)) {
                    System.out.println("错误: 您不是参赛选手！");
                    continue;
                }
                gamerMenu((Gamer) currentPlayer);
            } else if (role == 2) {
                if (!(currentPlayer instanceof MatchAdmin)) {
                    System.out.println("错误: 您不是管理员！");
                    continue;
                }
                adminMenu((MatchAdmin) currentPlayer);
            } else {
                System.out.println("无效选项！");
            }
        }
    }
}
